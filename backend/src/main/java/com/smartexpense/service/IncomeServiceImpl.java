package com.smartexpense.service;

import com.smartexpense.dto.IncomeRequest;
import com.smartexpense.dto.IncomeResponse;
import com.smartexpense.entity.Income;
import com.smartexpense.entity.User;
import com.smartexpense.exception.BadRequestException;
import com.smartexpense.exception.ResourceNotFoundException;
import com.smartexpense.repository.IncomeRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncomeServiceImpl implements IncomeService {

    private final IncomeRepository incomeRepository;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<IncomeResponse> getIncomes(LocalDate startDate, LocalDate endDate, String source, String search) {
        User currentUser = authService.getCurrentUser();

        Specification<Income> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Eagerly fetch user to prevent N+1 query when mapping to response
            if (query != null && Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("user", jakarta.persistence.criteria.JoinType.LEFT);
            }

            // 1. Mandatory user scoping
            predicates.add(cb.equal(root.get("user").get("id"), currentUser.getId()));

            // 2. Optional date filters
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            // 3. Optional source filter
            if (source != null && !source.trim().isEmpty() && !"ALL".equalsIgnoreCase(source.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("source")), source.trim().toLowerCase()));
            }

            // 4. Optional search in description or source
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate descPredicate = cb.like(cb.lower(root.get("description")), pattern);
                Predicate sourcePredicate = cb.like(cb.lower(root.get("source")), pattern);
                predicates.add(cb.or(descPredicate, sourcePredicate));
            }

            if (query != null) {
                query.orderBy(cb.desc(root.get("date")), cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return incomeRepository.findAll(spec).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public IncomeResponse getIncomeById(Long id) {
        User currentUser = authService.getCurrentUser();
        Income income = incomeRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));
        return mapToResponse(income);
    }

    @Override
    @Transactional
    public IncomeResponse createIncome(IncomeRequest request) {
        User currentUser = authService.getCurrentUser();

        validateIncomeRequest(request);

        Income income = Income.builder()
                .user(currentUser)
                .amount(request.getAmount())
                .source(request.getSource().trim())
                .date(request.getDate())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .build();

        Income saved = incomeRepository.save(income);
        log.info("Created income with ID: {} for user: {}", saved.getId(), currentUser.getEmail());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public IncomeResponse updateIncome(Long id, IncomeRequest request) {
        User currentUser = authService.getCurrentUser();

        Income income = incomeRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));

        validateIncomeRequest(request);

        income.setAmount(request.getAmount());
        income.setSource(request.getSource().trim());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        Income updated = incomeRepository.save(income);
        log.info("Updated income with ID: {} for user: {}", updated.getId(), currentUser.getEmail());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteIncome(Long id) {
        User currentUser = authService.getCurrentUser();

        Income income = incomeRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));

        incomeRepository.delete(income);
        log.info("Deleted income with ID: {} for user: {}", id, currentUser.getEmail());
    }

    private void validateIncomeRequest(IncomeRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }
        if (request.getDate() == null) {
            throw new BadRequestException("Income date is required");
        }
        if (request.getDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("Income date cannot be in the future");
        }
        if (request.getSource() == null || request.getSource().trim().isEmpty()) {
            throw new BadRequestException("Income source is required");
        }
    }

    private IncomeResponse mapToResponse(Income income) {
        return IncomeResponse.builder()
                .id(income.getId())
                .userId(income.getUser().getId())
                .amount(income.getAmount())
                .source(income.getSource())
                .description(income.getDescription())
                .date(income.getDate())
                .createdAt(income.getCreatedAt())
                .build();
    }
}
